"use client";

import * as ChannelService from "@channel.io/channel-web-sdk-loader";
import { jwtDecode } from "jwt-decode";
import { overlay } from "overlay-kit";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Cookies } from "react-cookie";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import { LOCAL_STORAGE_KEY } from "@sparcs-clubs/web/constants/localStorage";
import patchNoteList from "@sparcs-clubs/web/constants/patchNote";
import {
  getLocalStorageItem,
  removeLocalStorageItem,
  setLocalStorageItem,
  subscribeLocalStorageSet,
  unsubscribeLocalStorageSet,
} from "@sparcs-clubs/web/utils/localStorage";
import logger from "@sparcs-clubs/web/utils/logger";

import AgreementModal from "../components/Modal/AgreeModal";
import PatchNoteModal from "../components/Modal/PatchNoteModal";
import getLogin from "../services/getLogin";
import getUserAgree from "../services/getUserAgree";
import postLogout from "../services/postLogout";
import postUserAgree from "../services/postUserAgree";

export type Profile = {
  id: number;
  name: string;
  type: UserTypeEnum;
  email?: string;
};
interface AuthContextType {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  profile: Profile | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [profile, setProfile] = useState<Profile | undefined>(undefined);
  const [isAgreed, setIsAgreed] = useState(true);

  const checkAgree = async () => {
    const agree = await getUserAgree();
    setIsAgreed(agree.status.isAgree);
  };

  const latestPatchNote = useMemo(
    () =>
      patchNoteList.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )[0],
    [patchNoteList],
  );

  const isLatest = useMemo(() => {
    const latestPatchNoteVersionSeen = getLocalStorageItem(
      LOCAL_STORAGE_KEY.LATEST_PATCH_NOTE_VERSION_SEEN,
    );
    const latestPatchNoteVersionActual = latestPatchNote.version;
    return !(
      latestPatchNoteVersionSeen == null ||
      latestPatchNoteVersionSeen !== latestPatchNoteVersionActual
    );
  }, [latestPatchNote]);

  useEffect(() => {
    const update = () => {
      const token = getLocalStorageItem("accessToken");
      if (token) {
        setIsLoggedIn(true);
        const decoded: Profile = jwtDecode(token);
        setProfile(decoded);
      }
      if (!token) {
        setIsLoggedIn(false);
        setProfile(undefined);
      }
    };

    update();
    subscribeLocalStorageSet(update);

    return () => unsubscribeLocalStorageSet(update);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      const cookies = new Cookies();
      const responseToken = cookies.get("accessToken");
      if (responseToken !== undefined) {
        setLocalStorageItem("responseToken", JSON.stringify(responseToken));
        if (responseToken) {
          setLocalStorageItem(
            "accessToken",
            responseToken.professor ??
              responseToken.doctor ??
              responseToken.master ??
              responseToken.undergraduate ??
              responseToken.employee ??
              responseToken.executive ??
              "",
          );
          setIsLoggedIn(true);
          cookies.remove("accessToken");
          logger.log("Logged in successfully.");
        }
      }
    }
  }, [isLoggedIn]);

  const login = async () => {
    try {
      const response = await getLogin();
      window.location.href = response.url;
    } catch (error) {
      logger.error("Login failed", error);
    }
  };

  const logout = async () => {
    try {
      await postLogout();
      setIsLoggedIn(false);
      removeLocalStorageItem("accessToken");
      removeLocalStorageItem("responseToken");
      const cookies = new Cookies();
      cookies.remove("accessToken");
      logger.log("Logged out successfully.");
    } catch (_) {
      setIsLoggedIn(false);
      removeLocalStorageItem("accessToken");
      removeLocalStorageItem("responseToken");
      const cookies = new Cookies();
      cookies.remove("accessToken");
      logger.log("Logged out.");
    }
  };

  //패치노트
  useEffect(() => {
    if (!isLatest && isLoggedIn) {
      localStorage.setItem(
        LOCAL_STORAGE_KEY.LATEST_PATCH_NOTE_VERSION_SEEN,
        latestPatchNote.version,
      );
      overlay.open(({ isOpen, close }) => (
        <PatchNoteModal
          isOpen={isOpen}
          onConfirm={close}
          latestPatchNote={latestPatchNote}
        />
      ));
    }
  }, [isLatest, latestPatchNote, isLoggedIn]);

  //개인정보 제공 동의
  useEffect(() => {
    if (isLoggedIn) {
      checkAgree();
    }
    if (!isAgreed && isLoggedIn) {
      overlay.open(({ isOpen, close }) => (
        <AgreementModal
          isOpen={isOpen}
          onAgree={async () => {
            try {
              await postUserAgree();
              setIsAgreed(true);
              close();
            } catch (_) {
              window.location.reload();
            }
          }}
          onDisagree={async () => {
            await logout();
            close();
          }}
        />
      ));
    }
  }, [isAgreed, isLoggedIn]);

  const value = useMemo(
    () => ({ isLoggedIn, login, logout, profile }),
    [isLoggedIn, profile],
  );

  useEffect(() => {
    // Channel Talk
    ChannelService.loadScript();
    ChannelService.boot({
      pluginKey: "f9e90cc5-6304-4987-8a60-5332d572c332",
      memberId: profile?.id ? profile?.id.toString() : undefined,
      profile:
        profile !== undefined
          ? {
              name: profile.name,
              email: profile?.email || null,
            }
          : undefined,
    });
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
