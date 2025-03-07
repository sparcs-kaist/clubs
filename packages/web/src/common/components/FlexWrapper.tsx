import isPropValid from "@emotion/is-prop-valid";
import styled from "styled-components";

interface FlexWrapperProps {
  direction?: "row" | "column";
  gap?: number;
  justify?: string;
  padding?: string;
}

const FlexWrapper = styled.div.withConfig({
  shouldForwardProp: prop => isPropValid(prop),
})<FlexWrapperProps>`
  display: flex;
  position: relative;
  flex-direction: ${({ direction }) => direction ?? "row"};
  gap: ${({ gap }) => (gap ? `${gap}px` : 0)};
  justify-content: ${({ justify }) => justify ?? "flex-start"};
  padding: ${({ padding }) => padding ?? 0};
`;

export default FlexWrapper;
