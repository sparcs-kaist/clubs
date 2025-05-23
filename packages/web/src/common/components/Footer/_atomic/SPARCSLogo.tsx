"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useTheme } from "styled-components";

import sparcsSvg from "@sparcs-clubs/web/assets/sparcs-black.svg";
import paths from "@sparcs-clubs/web/constants/paths";

const SPARCSLogo = () => {
  const theme = useTheme();
  const [isSmallView, setIsSmallView] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallView(
        window.innerWidth <= parseInt(theme.responsive.BREAKPOINT.md),
      );
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Link
      href={isSmallView ? paths.MADE_BY.path : "https://sparcs.org"}
      target={isSmallView ? "_self" : "_blank"}
      rel={isSmallView ? undefined : "noopener noreferrer"}
    >
      <object data={sparcsSvg} type="image/svg+xml">
        <Image src={sparcsSvg} alt="SPARCS" height={24} />
      </object>
    </Link>
  );
};

export default SPARCSLogo;
