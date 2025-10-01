import { emitRaffleCreated } from "../../../../../config/socket";

export default {
  async afterCreate(event) {
    const { result } = event;

    emitRaffleCreated({
      raffleId: result.id,
      title: result.title,
      description: result.description,
      endDate: result.endDate,
      availableAmount: result.availableAmount,
    });
  },
};
