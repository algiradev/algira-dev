import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" }, // 👈 abre para todos o pon tu dominio
  });

  io.on("connection", (socket) => {
    console.log("Cliente conectado:", socket.id);

    socket.on("disconnect", () => {
      console.log("Cliente desconectado:", socket.id);
    });
  });
};

export const emitRaffleUpdate = (
  raffleId,
  availableAmount,
  ticketsBought: number[],
  userId
) => {
  if (io) {
    io.emit("raffle:update", {
      raffleId,
      availableAmount,
      ticketsBought,
      userId,
    });
  }
};

export const emitRaffleDraw = (payload: {
  raffleId: number;
  ticketNumber: number;
  userName: string;
  userEmail: string;
  noTickets?: boolean;
  message?: string;
}) => {
  if (io) {
    io.emit("raffle:draw", payload);
  }
};

export const emitRaffleCountdown = (payload: {
  raffleId: number;
  title: string;
  endDate: string;
}) => {
  if (io) {
    io.emit("raffle:countdown", payload);
  }
};

export const emitRaffleCreated = (payload: {
  raffleId: number;
  title: string;
  description: string;
  endDate: string;
  availableAmount: number;
}) => {
  if (io) {
    io.emit("raffle:created", payload);
  }
};
