import Head from "next/head";
import { Toaster } from "react-hot-toast";
import { Provider as ReduxProvider } from "react-redux";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { SettingsConsumer, SettingsProvider } from "../contexts/settings-context";
import { RTL } from "../components/rtl";
import { store } from "../store";
import { createTheme } from "../theme";
import { createEmotionCache } from "../utils/create-emotion-cache";
import "../libs/nprogress";
import { PrivateRoute } from "../components/PrivateRoute";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMediaPredicate } from "react-media-hook";
import Error500 from "./500";
import { ErrorBoundary } from "react-error-boundary";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en.json";
import CippSpeedDial from "../components/CippComponents/CippSpeedDial";
import {
  Help as HelpIcon,
  BugReport as BugReportIcon,
  Feedback as FeedbackIcon,
  AutoStories,
  Gavel,
} from "@mui/icons-material";
import { SvgIcon } from "@mui/material";
import discordIcon from "../../public/discord-mark-blue.svg";
import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/router";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

const ReactQueryDevtoolsProduction = React.lazy(() =>
  import("@tanstack/react-query-devtools/build/modern/production.js").then((d) => ({
    default: d.ReactQueryDevtools,
  }))
);
TimeAgo.addDefaultLocale(en);

const queryClient = new QueryClient();
const clientSideEmotionCache = createEmotionCache();
const App = (props) => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const getLayout = Component.getLayout ?? ((page) => page);
  const preferredTheme = useMediaPredicate("(prefers-color-scheme: dark)") ? "dark" : "light";
  const pathname = usePathname();
  const route = useRouter();

  const excludeQueryKeys = ["authmeswa"];

  // 👇 Persist TanStack Query cache to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const localStoragePersister = createSyncStoragePersister({
        storage: window.localStorage,
      });

      persistQueryClient({
        queryClient,
        persister: localStoragePersister,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        staleTime: 1000 * 60 * 5, // optional: 5 minutes
        buster: "v1",
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            const queryIsReadyForPersistence = query.state.status === "success";
            if (queryIsReadyForPersistence) {
              const { queryKey } = query;
              // Check if queryKey exists and has elements before accessing index 0
              if (!queryKey || !queryKey.length) {
                return false;
              }
              const queryKeyString = String(queryKey[0] || "");
              const excludeFromPersisting = excludeQueryKeys.some((key) =>
                queryKeyString.includes(key)
              );
              return !excludeFromPersisting;
            }
            return queryIsReadyForPersistence;
          },
        },
      });
    }
  }, []);

  const speedDialActions = [
    {
      id: "license",
      icon: <Gavel />,
      name: "License",
      href: "/license",
      onClick: () => route.push("/license"),
    },
    {
      id: "bug-report",
      icon: <BugReportIcon />,
      name: "Report Bug",
      href: "https://github.com/KelvinTegelaar/CIPP/issues/new?template=bug.yml",
      onClick: () =>
        window.open("https://github.com/KelvinTegelaar/CIPP/issues/new?template=bug.yml", "_blank"),
    },
    {
      id: "feature-request",
      icon: <FeedbackIcon />,
      name: "Request Feature",
      href: "https://github.com/KelvinTegelaar/CIPP/issues/new?template=feature.yml",
      onClick: () =>
        window.open(
          "https://github.com/KelvinTegelaar/CIPP/issues/new?template=feature.yml",
          "_blank"
        ),
    },
    {
      id: "discord",
      icon: (
        <SvgIcon
          component={discordIcon}
          viewBox="0 0 127.14 96.36"
          sx={{ fontSize: "1.5rem" }}
        ></SvgIcon>
      ),
      name: "Join the Discord!",
      href: "https://discord.gg/cyberdrain",
      onClick: () => window.open("https://discord.gg/cyberdrain", "_blank"),
    },
    {
      id: "documentation",
      icon: <AutoStories />,
      name: "Check the Documentation",
      href: `https://docs.cipp.app/user-documentation/${pathname}`,
      onClick: () => window.open(`https://docs.cipp.app/user-documentation/${pathname}`, "_blank"),
    },
  ];

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <title>CIPP</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <ReduxProvider store={store}>
        <QueryClientProvider client={queryClient}>
          <SettingsProvider>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <SettingsConsumer>
                {(settings) => {
                  if (!settings.isInitialized) {
                  }
                  const theme = createTheme({
                    colorPreset: "orange",
                    direction: settings.direction,
                    paletteMode:
                      settings.currentTheme?.value !== "browser"
                        ? settings.currentTheme?.value
                        : preferredTheme,
                    contrast: "high",
                  });

                  return (
                    <>
                      <ThemeProvider theme={theme}>
                        <RTL direction={settings.direction}>
                          <CssBaseline />
                          <ErrorBoundary FallbackComponent={Error500}>
                            <PrivateRoute>{getLayout(<Component {...pageProps} />)}</PrivateRoute>
                          </ErrorBoundary>
                          <Toaster position="top-center" />
                          <CippSpeedDial
                            actions={speedDialActions}
                            icon={<HelpIcon />}
                            position={{
                              bottom: 12,
                              right:
                                settings.isInitialized && settings?.showDevtools === true ? 60 : 12,
                            }}
                          />
                        </RTL>
                      </ThemeProvider>
                      {settings.isInitialized && settings?.showDevtools === true ? (
                        <React.Suspense fallback={null}>
                          <ReactQueryDevtoolsProduction />
                        </React.Suspense>
                      ) : null}
                    </>
                  );
                }}
              </SettingsConsumer>
            </LocalizationProvider>
          </SettingsProvider>
        </QueryClientProvider>
      </ReduxProvider>
    </CacheProvider>
  );
};

export default App;
