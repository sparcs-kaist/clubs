import { useTranslations } from "next-intl";

import TextButton, {
  TextButtonColor,
} from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import { Theme } from "@sparcs-clubs/web/styles/themes";

type FontWeight = keyof Theme["fonts"]["WEIGHT"];

interface FoldUnfoldButtonProps {
  folded: boolean;
  setFolded: (isFold: boolean) => void;
  disabled?: boolean;
  color?: TextButtonColor;
  fs?: number;
  fw?: FontWeight;
}

const FoldUnfoldButton = ({
  folded,
  setFolded,
  disabled = false,
  color = "BLACK",
  fs = 14,
  fw = "REGULAR",
}: FoldUnfoldButtonProps) => {
  const t = useTranslations("common");
  return (
    <TextButton
      fs={fs}
      fw={fw}
      color={color}
      disabled={disabled}
      text={folded ? t("펼치기") : t("접기")}
      onClick={() => setFolded(!folded)}
    />
  );
};

export default FoldUnfoldButton;
