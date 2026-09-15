import { UserController } from "./user.controller";

describe("student profile phone numbers", () => {
  const user = { id: 10 } as never;
  const phoneNumber = "010-1234-5678";
  const users = {
    getStudentPhoneNumberByUserId: jest.fn(),
    getUserPhoneNumber: jest.fn(),
    updatePhoneNumber: jest.fn(),
  };
  const publicUsers = { updateStudentPhoneNumber: jest.fn() };
  const controller = new UserController(users as never, publicUsers as never);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it.each(["undergraduate", "master", "doctor", "masterDoctor"])(
    "reads and updates the student phone for %s",
    async profile => {
      users.getStudentPhoneNumberByUserId.mockResolvedValue({ phoneNumber });
      await expect(
        controller.getPhoneNumber(user, { profile }),
      ).resolves.toEqual({
        phoneNumber,
      });
      expect(users.getStudentPhoneNumberByUserId).toHaveBeenCalledWith(10);

      await controller.updatePhoneNumber(user, { profile, phoneNumber });
      expect(publicUsers.updateStudentPhoneNumber).toHaveBeenCalledWith(
        10,
        phoneNumber,
      );
    },
  );

  it("fills a missing combined-degree student phone from the user record", async () => {
    users.getStudentPhoneNumberByUserId.mockResolvedValue(null);
    users.getUserPhoneNumber.mockResolvedValue({ phoneNumber });
    await expect(
      controller.getPhoneNumber(user, { profile: "masterDoctor" }),
    ).resolves.toEqual({ phoneNumber });
    expect(publicUsers.updateStudentPhoneNumber).toHaveBeenCalledWith(
      10,
      phoneNumber,
    );
  });
});
