import { Context } from "koa";

export default {
  async findAll(ctx: Context) {
    try {
      const users = await strapi.db
        .query("api::users-algira.users-algira")
        .findMany({
          where: { status_user: "a" },
          populate: ["rolId", "countryId"],
          orderBy: { createdAt: "desc" },
        });

      ctx.body = users.map((user) => ({
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
      }));
    } catch (err) {
      strapi.log.error("Error fetching users:", err);
      ctx.badRequest("No se pudieron obtener los usuarios");
    }
  },

  async updateUser(ctx: Context) {
    try {
      const { id } = ctx.params;
      const userId = parseInt(id, 10);

      const tokenUserId = ctx.state.user?.id;
      if (!tokenUserId) {
        return ctx.unauthorized("No estás autenticado");
      }

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

      const existingEmail = await strapi.db
        .query("api::users-algira.users-algira")
        .findOne({ where: { email, id: { $ne: userId } } });

      if (existingEmail) {
        return ctx.badRequest("Este email ya está registrado", {
          field: "email",
        });
      }

      const existingUsername = await strapi.db
        .query("api::users-algira.users-algira")
        .findOne({ where: { username, id: { $ne: userId } } });

      if (existingUsername) {
        return ctx.badRequest("Este username ya está registrado", {
          field: "username",
        });
      }

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
