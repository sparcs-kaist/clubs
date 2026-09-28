import styled from "styled-components";

export const Step = {
  Before: 0,
  Current: 1,
  After: 2,
} as const;

export type Step = (typeof Step)[keyof typeof Step];

const StepDot = styled.div<{ step: Step }>`
  display: flex;
  position: relative;
  width: 32px;
  height: 32px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  transition: 0.4s ease;

  border-radius: 16px;
  border: 4px solid
    ${props => {
      switch (props.step) {
        case Step.After:
          return props.theme.colors.MINT[300];
        case Step.Before:
          return props.theme.colors.GRAY[300];
        case Step.Current:
        default:
          return props.theme.colors.PRIMARY;
      }
    }};
  background-color: ${props => {
    switch (props.step) {
      case Step.After:
        return props.theme.colors.MINT[300];
      case Step.Before:
        return props.theme.colors.GRAY[200];
      case Step.Current:
      default:
        return props.theme.colors.PRIMARY;
    }
  }};
`;

export default StepDot;
