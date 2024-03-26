"use client";

import React from "react";
import styled from "styled-components";

const ExampleComponentInner = styled.div`
  color: ${({ theme }) => theme.colors.BLACK};
`;

const PhoneInput: React.FC<React.PropsWithChildren> = ({
  children = <div />,
}) => <ExampleComponentInner>{children}</ExampleComponentInner>;

export default PhoneInput;
