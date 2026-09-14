import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { OverlayProvider } from "overlay-kit";
import React from "react";
import { ThemeProvider as StyledProvider } from "styled-components";

import { defaultLocale } from "../src/i18n/config";
import agree from "../src/i18n/messages/ko/agree.json";
import common from "../src/i18n/messages/ko/common.json";
import theme from "../src/styles/themes";
import GlobalStyle from "./GlobalStyle";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchInterval: false,
      refetchIntervalInBackground: false,
      refetchOnReconnect: false,
      structuralSharing: false,
      retry: false,
    },
  },
});

const StoryProvider = ({ children }: React.PropsWithChildren) => (
  <>
    <GlobalStyle />
    {/* @ts-expect-error-next-line */}
    <StyledProvider theme={theme}>
      <NextIntlClientProvider
        locale={defaultLocale}
        messages={{ common, agree }}
        timeZone="Asia/Seoul"
      >
        <QueryClientProvider client={queryClient}>
          <OverlayProvider>{children}</OverlayProvider>
        </QueryClientProvider>
      </NextIntlClientProvider>
    </StyledProvider>
  </>
);

export default StoryProvider;
