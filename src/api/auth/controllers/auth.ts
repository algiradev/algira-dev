import type { Context } from "koa";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import emailService from "../services/email-service";

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

export default {
  async signup(ctx: Context) {
    try {
      const {
        email,
        password,
        username,
        firstName,
        lastName,
        phoneNumber,
        zipCode,
        address,
        avatar,
        city,
        businessId,
        countryId,
        status_user,
        rolId,
      } = ctx.request.body as {
        email: string;
        password: string;
        username: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        zipCode: string;
        address: string;
        avatar?: string;
        city?: string;
        businessId?: number;
        countryId: number;
        status_user?: string;
        rolId?: number;
      };

      // Verificar si el email o username ya existen
      const existingEmail = await strapi.db
        .query("api::users-algira.users-algira")
        .findOne({ where: { email } });
      if (existingEmail) {
        return ctx.badRequest("Este email ya está registrado", {
          field: "email",
        });
      }

      // Verificar si el username ya existe
      const existingUsername = await strapi.db
        .query("api::users-algira.users-algira")
        .findOne({ where: { username } });
      if (existingUsername) {
        return ctx.badRequest("Este username ya está registrado", {
          field: "username",
        });
      }

      const tokenEmail = crypto.randomBytes(20).toString("hex");

      const user = await strapi.entityService.create(
        "api::users-algira.users-algira",
        {
          data: {
            email,
            username,
            password,
            firstName,
            lastName,
            phoneNumber,
            zipCode,
            address,
            city,
            businessId,
            countryId,
            status_user: status_user || "a",
            tokenEmail,
            rol_id: rolId || 5,
            rolId: rolId || 5,
          },
        }
      );

      // Enviar email de confirmación
      strapi.log.info("➡️ Intentando enviar correo a " + email);

      await emailService.sendEmail({
        to: email,
        subject: "Confirmar tu cuenta",
        templateName: "confirm-email.html",
        replacements: {
          link: `${frontendUrl}/confirm-email/${tokenEmail}`,
          username,
          year: new Date().getFullYear().toString(),
        },
      });

      strapi.log.info("✅ Correo enviado a " + email);

      ctx.body = {
        message: "Revisa tu correo electrónico para confirmar tu cuenta",
        tokenEmail,
      };
    } catch (err) {
      ctx.internalServerError(err);
    }
  },

  async signin(ctx: Context) {
    const { email, password } = ctx.request.body as {
      email: string;
      password: string;
    };

    try {
      const user = await strapi.db
        .query("api::users-algira.users-algira")
        .findOne({
          where: { $or: [{ email }, { username: email }] },
          populate: ["rolId", "countryId", "avatar"],
        });
      if (!user) return ctx.badRequest("Usuario no encontrado");
      if (!user.confirmEmail)
        return ctx.badRequest(
          "Revisa tu correo electrónico para confirmar tu cuenta"
        );

      const passwordIsValid = await bcrypt.compare(password, user.password);
      console.log("Password:", password);
      console.log("Password user:", user.password);

      console.log('"Password is valid":', passwordIsValid);

      if (!passwordIsValid) return ctx.badRequest("Contraseña incorrecta");

      const token = strapi.service("plugin::users-permissions.jwt").issue(
        {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        { expiresIn: "1d" }
      );

      ctx.body = {
        accessToken: token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          zipCode: user.zipCode,
          address: user.address,
          avatar: user.avatar,
          city: user.city,
          businessId: user.businessId,
          countryId: user.countryId?.id,
          status_user: user.status_user,
          rolId: user.rolId?.id,
        },
        expiresIn: 86400,
      };
    } catch (err) {
      ctx.internalServerError(err);
    }
  },

  async confirmEmail(ctx: Context) {
    const { token } = ctx.params;

    try {
      const user = await strapi.db
        .query("api::users-algira.users-algira")
        .findOne({ where: { tokenEmail: token }, populate: ["rolId"] });
      if (!user) return ctx.notFound("Usuario no encontrado");
      if (user.confirmEmail)
        return ctx.badRequest("Correo electrónico ya confirmado");

      // Marcar email como confirmado
      await strapi.db.query("api::users-algira.users-algira").update({
        where: { id: user.id },
        data: { confirmEmail: true, tokenEmail: null },
      });

      // Crear cliente en Braintree
      const result = await strapi.service("api::auth.braintree").createClient({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phoneNumber,
      });

      if (!result.err && result.customer?.id) {
        await strapi.db
          .query("api::braintree-service.braintree-service")
          .create({
            data: {
              userId: user.id,
              customerId: result.customer.id,
              status: "a",
            },
          });
      }

      // Generar JWT
      const accessToken = strapi
        .service("plugin::users-permissions.jwt")
        .issue({
          id: user.id,
        });

      ctx.body = {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          zipCode: user.zipCode,
          address: user.address,
          avatar: user.avatar,
          city: user.city,
          businessId: user.businessId,
          countryId: user.countryId,
          status_user: user.status_user,
          rolId: user.rolId?.id,
        },
      };
    } catch (err) {
      ctx.internalServerError(err);
    }
  },

  async forgotPassword(ctx: Context) {
    const { email } = ctx.request.body as { email: string };

    try {
      const user = await strapi.db
        .query("api::users-algira.users-algira")
        .findOne({ where: { email } });
      if (!user) return ctx.notFound("Correo electrónico no encontrado");

      const tokenEmail = crypto.randomBytes(20).toString("hex");

      await strapi.db.query("api::users-algira.users-algira").update({
        where: { id: user.id },
        data: { tokenEmail },
      });

      await emailService.sendEmail({
        to: email,
        subject: "Restablecer contraseña",
        templateName: "reset-password.html",
        replacements: {
          link: `${frontendUrl}/reset-password/${tokenEmail}`,
          username: user.username,
          year: new Date().getFullYear().toString(),
        },
      });

      ctx.body = {
        message: "Email enviado para restablecer contraseña",
        tokenEmail,
      };
    } catch (err) {
      ctx.internalServerError(err);
    }
  },

  async resetPassword(ctx: Context) {
    const { token } = ctx.params;
    const { password } = ctx.request.body as { password: string };

    try {
      const user = await strapi.db
        .query("api::users-algira.users-algira")
        .findOne({ where: { tokenEmail: token } });
      if (!user) return ctx.notFound("Token inválido");

      const hashedPassword = await bcrypt.hash(password, 8);

      await strapi.db.query("api::users-algira.users-algira").update({
        where: { id: user.id },
        data: { password: hashedPassword, tokenEmail: null },
      });

      ctx.body = { message: "Contraseña restablecida correctamente" };
    } catch (err) {
      ctx.internalServerError(err);
    }
  },

  async updateUser(ctx: Context) {
    try {
      const { id } = ctx.params;
      const userId = parseInt(id, 10);

      const tokenUserId = ctx.state.user?.id;
      if (tokenUserId !== userId) {
        return ctx.unauthorized(
          "No tienes permiso para modificar este usuario"
        );
      }

      const {
        firstName,
        lastName,
        username,
        email,
        countryId,
        phoneNumber,
        address,
        zipCode,
      } = ctx.request.body;

      const updatedUser = await strapi.db
        .query("api::users-algira.users-algira")
        .update({
          where: { id: userId },
          data: {
            firstName,
            lastName,
            username,
            email,
            countryId,
            phoneNumber,
            address,
            zipCode,
          },
          populate: ["rolId"],
        });

      ctx.body = {
        message: "Perfil actualizado correctamente",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phoneNumber: updatedUser.phoneNumber,
          zipCode: updatedUser.zipCode,
          address: updatedUser.address,
          avatar: updatedUser.avatar,
          city: updatedUser.city,
          businessId: updatedUser.businessId,
          countryId: updatedUser.countryId,
          status_user: updatedUser.status_user,
          rolId: updatedUser.rolId?.id,
        },
      };
    } catch (err) {
      ctx.internalServerError(err);
    }
  },

  async updateAvatar(ctx: Context) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) {
        return ctx.unauthorized("No estás autenticado");
      }

      const { files } = ctx.request;
      if (!files || !files.files) {
        return ctx.badRequest("No se proporcionó ninguna imagen");
      }

      const file = Array.isArray(files.files) ? files.files[0] : files.files;

      const uploadedFiles = await strapi.plugins[
        "upload"
      ].services.upload.upload({
        data: {
          refId: userId,
          ref: "api::users-algira.users-algira",
          field: "avatar",
        },
        files: file,
      });

      if (!uploadedFiles || uploadedFiles.length === 0) {
        return ctx.badRequest("No se pudo subir la imagen");
      }

      const updatedUser = await strapi.db
        .query("api::users-algira.users-algira")
        .findOne({ where: { id: userId }, populate: ["rolId", "avatar"] });

      ctx.body = {
        message: "Imagen de perfil actualizada correctamente",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phoneNumber: updatedUser.phoneNumber,
          zipCode: updatedUser.zipCode,
          address: updatedUser.address,
          avatar: updatedUser.avatar,
          city: updatedUser.city,
          businessId: updatedUser.businessId,
          countryId: updatedUser.countryId,
          status_user: updatedUser.status_user,
          rolId: updatedUser.rolId?.id,
        },
      };
    } catch (err) {
      ctx.internalServerError(err);
    }
  },
};
