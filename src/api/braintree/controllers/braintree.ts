import type { Context } from "koa";
import gateway from "../../../extensions/braintree";
import path from "path";
import fs from "fs";
import puppeteer from "puppeteer";

import { formatDateToLocal } from "../../../utils/dateFormatter";
import { emitRaffleUpdate } from "../../../../config/socket";
import emailService from "../../auth/services/email-service";

function formatDateForFilename(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    pad(date.getDate()) +
    pad(date.getMonth() + 1) +
    date.getFullYear() +
    pad(date.getHours()) +
    pad(date.getMinutes())
  ); // ddmmyyyyhhmm
}

export default {
  // Genera clientToken
  async generateToken(ctx: Context) {
    try {
      const response = await gateway.clientToken.generate({});
      ctx.send({ clientToken: response.clientToken, success: true });
    } catch (error: any) {
      console.error("Error generating client token:", error);
      ctx.throw(500, `Error generating client token: ${error.message}`);
    }
  },

  // ./src/api/payment/controllers/payment.ts (o .js según tu setup)

  async processPayment(ctx: Context) {
    try {
      const body = ctx.request.body;
      if (!body || Object.keys(body).length === 0) {
        ctx.throw(400, "Request body is empty");
      }

      const { paymentMethodNonce, amount, raffles, tickets } = body as {
        paymentMethodNonce: string;
        amount: number;
        raffles: number[];
        tickets: { number: number; raffleId: number }[];
      };

      if (!paymentMethodNonce) ctx.throw(400, "paymentMethodNonce is required");
      if (!amount || amount <= 0) ctx.throw(400, "Valid amount is required");

      // 🔹 Procesar pago con Braintree
      const result = await gateway.transaction.sale({
        amount: amount.toFixed(2),
        paymentMethodNonce,
        options: { submitForSettlement: true },
      });

      if (!result.success) {
        ctx.send({ success: false, error: result.message });
        return;
      }

      const transaction = result.transaction;

      // 🔹 Crear factura
      const newInvoice = await strapi.entityService.create(
        "api::invoice.invoice",
        {
          data: {
            total: amount,
            currency: "USD",
            transactionId: transaction.id,
            transactionStatus: transaction.status,
            transactionDate: new Date(transaction.createdAt),
            users_algira: ctx.state.user?.id,
          },
          populate: ["tickets", "users_algira"],
        }
      );

      // 🔹 Crear tickets asociados
      const ticketsData = tickets.map((t) => ({
        code: `${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        number: t.number,
        invoiceId: newInvoice.id,
        raffle: t.raffleId,
      }));

      await Promise.all(
        ticketsData.map((ticket) =>
          strapi.entityService.create("api::ticket.ticket", {
            data: {
              code: ticket.code,
              number: ticket.number,
              raffle: ticket.raffle,
              invoiceId: ticket.invoiceId,
            },
            populate: ["raffle", "invoiceId"],
          })
        )
      );

      const userEmail = ctx.state.user?.email;
      const userName = ctx.state.user?.username ?? "Usuario";

      // 🔹 Agrupar tickets por rifa
      const ticketsByRaffle: Record<number, number[]> = {};
      ticketsData.forEach((t) => {
        if (!ticketsByRaffle[t.raffle]) ticketsByRaffle[t.raffle] = [];
        ticketsByRaffle[t.raffle].push(t.number);
      });

      // 🔹 Obtener rifas
      const rafflesRecords = await strapi.db
        .query("api::raffle.raffle")
        .findMany({
          where: { id: { $in: raffles } },
          select: [
            "id",
            "title",
            "price",
            "endDate",
            "maxQuantity",
            "availableAmount",
          ],
        });

      // 🔹 Actualizar cantidad disponible
      for (const raffle of rafflesRecords) {
        const ticketsCount = await strapi.db
          .query("api::ticket.ticket")
          .count({ where: { raffle: raffle.id } });

        const newAvailable = Math.max(
          (raffle.maxQuantity ?? 0) - ticketsCount,
          0
        );

        await strapi.db.query("api::raffle.raffle").update({
          where: { id: raffle.id },
          data: { availableAmount: newAvailable },
        });

        const ticketsNumbers = ticketsData
          .filter((t) => t.raffle === raffle.id)
          .map((t) => t.number);

        emitRaffleUpdate(
          raffle.id,
          newAvailable,
          ticketsNumbers,
          ctx.state.user?.id
        );

        strapi.log.info(
          `📢 raffle:update -> raffleId=${raffle.id}, availableAmount=${newAvailable}`
        );
      }

      // 🔹 Crear filas HTML para la tabla
      let rafflesRows = "";
      for (const raffle of rafflesRecords) {
        const numbers = ticketsByRaffle[raffle.id] ?? [];
        const qty = numbers.length;
        const subtotal = raffle.price * qty;
        const endDate = formatDateToLocal(raffle.endDate);

        rafflesRows += `
        <tr>
          <td>${raffle.title}</td>
          <td align="center">$${raffle.price.toFixed(2)}</td>
          <td align="center">${numbers.join(", ")}</td>
          <td align="center">${endDate}</td>
          <td align="right">$${subtotal.toFixed(2)}</td>
        </tr>`;
      }

      // ===============================
      // 🔹 Generar PDF del Invoice
      // ===============================
      const invoicesDir = path.join(strapi.dirs.static.public, "invoices");
      if (!fs.existsSync(invoicesDir))
        fs.mkdirSync(invoicesDir, { recursive: true });

      const timestamp = formatDateForFilename(new Date(transaction.createdAt));
      const safeUsername = (userName || "usuario").replace(/\s+/g, "_");
      const pdfFilename = `${transaction.id}${safeUsername}${timestamp}.pdf`;
      const pdfPath = path.join(invoicesDir, pdfFilename);

      const templateHtmlString = fs.readFileSync(
        path.join(
          strapi.dirs.app.root,
          "public/email-templates/purchase-confirmation.html"
        ),
        "utf8"
      );

      let htmlContent = templateHtmlString
        .replace(/{{userName}}/g, userName)
        .replace(/{{amount}}/g, amount.toFixed(2))
        .replace(/{{invoiceId}}/g, transaction.id)
        .replace(
          /{{transactionDate}}/g,
          formatDateToLocal(transaction.createdAt)
        )
        .replace(/{{rafflesRows}}/g, rafflesRows)
        .replace(/{{year}}/g, new Date().getFullYear().toString());

      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });
      await page.pdf({
        path: pdfPath,
        format: "A4",
        printBackground: true,
        margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
      });
      await browser.close();

      // 🔹 Enviar correo con PDF adjunto
      await emailService.sendEmail({
        to: userEmail,
        subject: "Factura de compra - Algira",
        templateName: "purchase-confirmation.html",
        replacements: {
          userName,
          amount: amount.toFixed(2),
          invoiceId: transaction.id,
          transactionDate: formatDateToLocal(transaction.createdAt),
          rafflesRows,
          year: new Date().getFullYear().toString(),
        },
        attachments: [
          {
            filename: pdfFilename,
            path: pdfPath,
          },
        ],
      });

      // ✅ Respuesta final
      ctx.send({
        success: true,
        message:
          "Pago procesado, invoice, tickets y PDF generados correctamente",
        invoice: newInvoice,
      });
    } catch (error: any) {
      console.error("Error processing payment:", error);
      ctx.throw(500, `Error processing payment: ${error.message}`);
    }
  },
};
