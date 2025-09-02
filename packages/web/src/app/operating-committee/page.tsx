"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";

const ExecutiveActivityReportDetail = () => {
  const { isLoggedIn, login, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 활동보고서 관련 상태
  const [activityReportId, setActivityReportId] = useState("");
  const [activityReportSecretKey, setActivityReportSecretKey] = useState("");

  // 자금관리 관련 상태
  const [fundingId, setFundingId] = useState("");
  const [fundingSecretKey, setFundingSecretKey] = useState("");

  useEffect(() => {
    if (isLoggedIn !== undefined || profile !== undefined) {
      setLoading(false);
    }
  }, [isLoggedIn, profile]);

  if (loading) {
    return <AsyncBoundary isLoading={loading} isError />;
  }

  if (!isLoggedIn || !profile) {
    return <LoginRequired login={login} />;
  }

  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[{ name: "운영위원 페이지", path: "/operating-committee" }]}
        title="운영위원 페이지"
      />

      <FlexWrapper direction="row" gap={40} style={{ width: "100%" }}>
        {/* 활동보고서 바로가기 섹션 */}
        <Card outline gap={20} padding="24px" style={{ flex: 1 }}>
          <Typography fs={24} lh={32} fw="SEMIBOLD">
            활동 보고서
          </Typography>
          <Typography fs={16} lh={24} color="GRAY.600">
            활동 보고서 상세 페이지로 이동합니다
          </Typography>

          <FlexWrapper direction="column" gap={12}>
            <TextInput
              placeholder="활동보고서 ID를 입력하세요"
              value={activityReportId}
              handleChange={setActivityReportId}
            />

            <TextInput
              type="password"
              placeholder="시크릿 키를 입력하세요"
              value={activityReportSecretKey}
              handleChange={setActivityReportSecretKey}
            />

            <Button
              onClick={() =>
                router.push(
                  `/operating-committee/activity-report/${activityReportId}?operating-committee-secret=${activityReportSecretKey}`,
                )
              }
              type={
                activityReportId.trim() && activityReportSecretKey.trim()
                  ? "default"
                  : "disabled"
              }
            >
              이동
            </Button>
          </FlexWrapper>
        </Card>

        {/* 지원금 바로가기 섹션 */}
        <Card outline gap={20} padding="24px" style={{ flex: 1 }}>
          <Typography fs={24} lh={32} fw="SEMIBOLD">
            지원금 바로가기
          </Typography>
          <Typography fs={16} lh={24} color="GRAY.600">
            지원금 상세 페이지로 이동합니다
          </Typography>

          <FlexWrapper direction="column" gap={12}>
            <TextInput
              placeholder="지원금 ID를 입력하세요"
              value={fundingId}
              handleChange={setFundingId}
            />

            <TextInput
              type="password"
              placeholder="시크릿 키를 입력하세요"
              value={fundingSecretKey}
              handleChange={setFundingSecretKey}
            />

            <Button
              onClick={() =>
                router.push(
                  `/operating-committee/funding/${fundingId}?operating-committee-secret=${fundingSecretKey}`,
                )
              }
              type={
                fundingId.trim() && fundingSecretKey.trim()
                  ? "default"
                  : "disabled"
              }
            >
              이동
            </Button>
          </FlexWrapper>
        </Card>
      </FlexWrapper>
    </FlexWrapper>
  );
};

export default ExecutiveActivityReportDetail;
