import React, { useState } from "react";

import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import Markdown from "@sparcs-clubs/web/common/components/Markdown";
import Select from "@sparcs-clubs/web/common/components/Select";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import AgendaContent from "@sparcs-clubs/web/features/meeting/agenda/constants/agendaContent";
import {
  AgendaTypeEnum,
  AgendaTypeName,
} from "@sparcs-clubs/web/features/meeting/agenda/constants/agendaType";

interface AgendaEditorProps {
  agendaContent: AgendaContent;
  onCancel: () => void;
  onSave: (agendaContent: AgendaContent) => void;
}

const AgendaEditor: React.FC<AgendaEditorProps> = ({
  agendaContent,
  onCancel,
  onSave,
}: AgendaEditorProps) => {
  const [currentAgenda, setCurrentAgenda] = useState(agendaContent);

  return (
    <Card outline gap={32}>
      <FlexWrapper gap={4} direction="column">
        <Typography fs={16} lh={20} fw="MEDIUM">
          안건 종류
        </Typography>
        <Select
          items={Object.values(AgendaTypeEnum).map(value => ({
            label: AgendaTypeName[value],
            value,
          }))}
          value={currentAgenda.type}
          onChange={(value: AgendaTypeEnum) => {
            setCurrentAgenda({ ...currentAgenda, type: value });
          }}
        />
      </FlexWrapper>
      <FlexWrapper gap={4} direction="column">
        <Typography fs={16} lh={20} fw="MEDIUM">
          안건 제목
        </Typography>
        <TextInput
          placeholder="안건 제목을 입력해주세요"
          value={currentAgenda.title}
          handleChange={(title: string) => {
            setCurrentAgenda({ ...currentAgenda, title });
          }}
        />
      </FlexWrapper>
      <FlexWrapper gap={4} direction="column">
        <Typography fs={16} lh={20} fw="MEDIUM">
          안건 내용
        </Typography>
        <Markdown
          placeholder="안건 내용을 입력해주세요"
          initialValue={currentAgenda.content}
          onChange={(content: string) => {
            setCurrentAgenda({ ...currentAgenda, content });
          }}
        />
      </FlexWrapper>
      <FlexWrapper gap={10} direction="row" style={{ marginLeft: "auto" }}>
        <Button onClick={onCancel}>취소</Button>
        <Button onClick={() => onSave(currentAgenda)}>저장</Button>
      </FlexWrapper>
    </Card>
  );
};

export default AgendaEditor;
