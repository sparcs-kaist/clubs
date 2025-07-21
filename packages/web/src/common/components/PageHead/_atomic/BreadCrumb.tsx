import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React from "react";
import styled from "styled-components";

import Icon from "@sparcs-clubs/web/common/components/Icon";
import colors from "@sparcs-clubs/web/styles/themes/colors";

import BreadCrumbItem from "./BreadCrumbItem";

interface BreadCrumbItemDetails {
  name: string;
  path: string;
}

interface BreadCrumbProps {
  items: BreadCrumbItemDetails[];
  enableLast?: boolean;
}

const BreadCrumbContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    gap: 8px;
  }
`;

const BreadCrumb: React.FC<BreadCrumbProps> = ({
  items,
  enableLast = false,
}) => {
  const t = useTranslations("common");
  const itemsWithMain = [{ name: t("메인"), path: "/" }, ...items];
  const router = useRouter();

  return (
    <BreadCrumbContainer>
      {itemsWithMain.map((item, index) => (
        <React.Fragment key={item.name}>
          <BreadCrumbItem
            text={item.name}
            disabled={index === itemsWithMain.length - 1 ? !enableLast : false}
            onClick={() => {
              router.push(item.path);
            }}
          />
          {index < itemsWithMain.length - 1 && (
            <Icon type="chevron_right" size={20} color={colors.PRIMARY} />
          )}
        </React.Fragment>
      ))}
    </BreadCrumbContainer>
  );
};

export default BreadCrumb;
