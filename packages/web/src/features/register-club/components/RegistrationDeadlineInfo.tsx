import { useFormatter, useTranslations } from "next-intl";

import Info from "@sparcs-clubs/web/common/components/Info";
import type { Semester } from "@sparcs-clubs/web/types/semester";

interface RegistrationDeadlineInfoProps {
  deadline: Date;
  semester?: Pick<Semester, "name" | "year">;
}

const RegistrationDeadlineInfo = ({
  deadline,
  semester,
}: RegistrationDeadlineInfoProps) => {
  const t = useTranslations("my.registration");
  const format = useFormatter();
  const semesterNames: Record<string, string> = {
    봄: t("spring"),
    가을: t("fall"),
  };

  return (
    <Info
      text={t("deadlineInfo", {
        year: semester?.year ?? "",
        semester: semesterNames[semester?.name ?? ""] ?? semester?.name ?? "",
        deadline: format.dateTime(new Date(deadline), {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Seoul",
        }),
      })}
    />
  );
};

export default RegistrationDeadlineInfo;
