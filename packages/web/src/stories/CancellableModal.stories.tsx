import { useArgs } from "@storybook/preview-api";

import { Meta, StoryObj } from "@storybook/react";

import Button, { ButtonProps } from "../common/components/Button";
import Modal from "../common/components/Modal";
import CancellableModalContent from "../common/components/Modal/CancellableModalContent";

const meta: Meta<ButtonProps & { modalText: string }> = {
  title: "Modal/CancellableModal",
  component: Button,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    Story => (
      <div
        style={{
          padding: "16px",
          boxSizing: "border-box",
          height: "50vh",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<ButtonProps & { modalText: string }>;

export const CancellableModal: Story = {
  args: {
    modalText: "공고를 삭제하면 복구할 수 없습니다. ㄱㅊ?",
    children: "삭제",
  },
  parameters: {
    docs: {
      inlineStories: false,
    },
  },
  render: function Render({ modalText, ...props }) {
    const [{ value }, updateArgs] = useArgs<{ value: boolean }>();

    const handleClick = () => {
      updateArgs({ value: true });
    };

    return (
      <>
        <Button {...props} onClick={handleClick}>
          {props.children}
        </Button>
        <Modal isOpen={value}>
          <CancellableModalContent
            onConfirm={() => updateArgs({ value: false })}
            onClose={() => updateArgs({ value: false })}
          >
            {modalText}
          </CancellableModalContent>
        </Modal>
      </>
    );
  },
  argTypes: {
    modalText: {
      control: "text",
      description: "모달에 표시되는 텍스트",
    },
    children: {
      control: "text",
      description: "버튼에 표시되는 텍스트",
    },
  },
};
