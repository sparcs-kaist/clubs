import isPropValid from "@emotion/is-prop-valid";
import styled from "styled-components";

interface FlexWrapperProps {
  direction: "row" | "column";
  gap: number;
  justify?: string;
}

const FlexWrapper = styled.div.withConfig({
  shouldForwardProp: prop => isPropValid(prop),
})<FlexWrapperProps>`
  display: flex;
  flex-direction: ${({ direction }) => direction};
  gap: ${({ gap }) => `${gap}px`};
  justify-content: ${({ justify }) => justify ?? "flex-start"};
`;

export default FlexWrapper;
