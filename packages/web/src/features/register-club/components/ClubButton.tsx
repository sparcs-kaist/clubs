import React, { useId } from "react";

import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import Typography from "@sparcs-clubs/web/common/components/Typography";

interface ClubButtonProps {
  title: string;
  buttonText: string[];
  unavailableReason: string | null;
  onClick: VoidFunction;
}

const ClubButton: React.FC<ClubButtonProps> = ({
  title,
  buttonText,
  unavailableReason,
  onClick,
}) => {
  const reasonId = useId();
  return (
    <Card outline padding="20px 24px" gap={16}>
      <Typography fw="MEDIUM" fs={20} lh={24}>
        {title}
      </Typography>
      <ul style={{ paddingLeft: 20, margin: 0, flex: 1 }}>
        {buttonText.map(text => (
          <li key={text}>
            <Typography fs={14} lh={24}>
              {text}
            </Typography>
          </li>
        ))}
      </ul>
      {unavailableReason && (
        <Typography id={reasonId} fs={14} lh={20} color="GRAY.600">
          {unavailableReason}
        </Typography>
      )}
      <Button
        type={unavailableReason ? "disabled" : "default"}
        aria-label={`${title} 신청서 작성`}
        aria-describedby={unavailableReason ? reasonId : undefined}
        onClick={onClick}
      >
        신청서 작성
      </Button>
    </Card>
  );
};

export default ClubButton;
