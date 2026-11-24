import Link from "next/link";
import { useTranslations } from "next-intl";
import React from "react";

import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Info from "@sparcs-clubs/web/common/components/Info";
import RestoreDraftModal from "@sparcs-clubs/web/common/components/Modal/RestoreDraftModal";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import useGetSemesterNow from "@sparcs-clubs/web/utils/getSemesterNow";

import RegisterClubForm from "../components/RegisterClubForm";
import RegistrationDeadlineInfo from "../components/RegistrationDeadlineInfo";
import useRegistrationDraft from "../hooks/useRegistrationDraft";

interface RegisterClubMainFrameProps {
  type: RegistrationTypeEnum;
  deadline: Date | null;
}

const RegisterClubMainFrame: React.FC<RegisterClubMainFrameProps> = ({
  type,
  deadline = undefined,
}) => {
  const t = useTranslations("my.registration");
  const historyT = useTranslations("registrationHistory");
  const registrationName = t(`types.${type}`);
  const {
    savedData,
    isLoading: isDraftLoading,
    isModalOpen,
    handleConfirm,
    handleClose,
  } = useRegistrationDraft(type);

  const {
    semester: semesterInfo,
    isLoading: semesterLoading,
    isError: semesterError,
  } = useGetSemesterNow();

  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[
          {
            name: t("title"),
            path: `/register-club`,
          },
        ]}
        title={t("applicationTitle", { type: registrationName })}
        enableLast
        action={
          <Link
            href="/my/register-club/previous"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "underline" }}
          >
            {historyT("title")}
          </Link>
        }
      />
      <AsyncBoundary isLoading={semesterLoading} isError={semesterError}>
        {deadline ? (
          <RegistrationDeadlineInfo
            deadline={deadline}
            semester={semesterInfo}
          />
        ) : (
          <Info text={t("registrationClosed")} />
        )}
      </AsyncBoundary>
      <AsyncBoundary isLoading={isDraftLoading} isError={false}>
        {isModalOpen ? (
          <RestoreDraftModal
            isOpen={isModalOpen}
            mainText={t("restoreApplicationDraft", { type: registrationName })}
            onConfirm={handleConfirm}
            onClose={handleClose}
          />
        ) : (
          <RegisterClubForm type={type} initialData={savedData} />
        )}
      </AsyncBoundary>
    </FlexWrapper>
  );
};

export default RegisterClubMainFrame;
