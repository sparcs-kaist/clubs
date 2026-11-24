import { UserController } from "./user.controller";

describe("my account phone number", () => {
  const user = { id: 10 } as never;
  const phoneNumber = "010-1234-5678";
  const users = { getUserPhoneNumber: jest.fn() };
  const publicUsers = { updatePhoneNumber: jest.fn() };
  const controller = new UserController(users as never, publicUsers as never);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it.each([phoneNumber, null])(
    "returns %s from the account without writing",
    async storedPhone => {
      users.getUserPhoneNumber.mockResolvedValue({ phoneNumber: storedPhone });

      await expect(controller.getPhoneNumber(user)).resolves.toEqual({
        phoneNumber: storedPhone,
      });
      expect(users.getUserPhoneNumber).toHaveBeenCalledTimes(1);
      expect(users.getUserPhoneNumber).toHaveBeenCalledWith(10);
      expect(publicUsers.updatePhoneNumber).not.toHaveBeenCalled();
    },
  );

  it.each([
    "undergraduate",
    "masterDoctorDoctor",
    "executive",
    "professor",
    "employee",
    undefined,
  ])(
    "updates the authenticated account once for the %s profile",
    async profile => {
      await expect(
        controller.updatePhoneNumber(user, { profile, phoneNumber }),
      ).resolves.toEqual({});

      expect(publicUsers.updatePhoneNumber).toHaveBeenCalledTimes(1);
      expect(publicUsers.updatePhoneNumber).toHaveBeenCalledWith(
        10,
        phoneNumber,
      );
      expect(users.getUserPhoneNumber).not.toHaveBeenCalled();
    },
  );
});
