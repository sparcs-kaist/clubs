import "viewerjs/dist/viewer.css";
import React, { useRef } from "react";
import Viewer from "viewerjs";

import FlexWrapper from "../FlexWrapper";
import { FileDetail, getFilePreviewType, openFileInNewTab } from "./attachment";
import ThumbnailPreview from "./ThumbnailPreview";

interface ThumbnailPreviewListProps {
  fileList: FileDetail[];
  onChange?: (files: FileDetail[]) => void;
  disabled?: boolean;
}

const ThumbnailPreviewList: React.FC<ThumbnailPreviewListProps> = ({
  fileList,
  onChange = () => {},
  disabled = false,
}: ThumbnailPreviewListProps) => {
  const viewerRef = useRef<HTMLDivElement>(null);

  const handleClick = (index: number) => {
    if (getFilePreviewType(fileList[index]) === "pdf") {
      openFileInNewTab(fileList[index], (url, target, features) =>
        window.open(url, target, features),
      );
      return;
    }

    if (!viewerRef.current) {
      return;
    }

    const images = viewerRef.current;

    const viewer = new Viewer(images, {
      hidden: () => {
        viewer.destroy();
      },
      initialViewIndex: index,
      title: [
        1,
        () =>
          `${fileList[viewer.index].name} (${viewer.index + 1} / ${fileList.length})`,
      ],
      toolbar: {
        prev: () => {
          viewer.prev(true);
        },
        next: () => {
          viewer.next(true);
        },
        download: () => {
          const fileSrc = fileList[viewer.index].url;

          fetch(fileSrc)
            .then(response => response.blob())
            .then(blob => {
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = fileList[viewer.index].name;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            });
        },
      },
      navbar: false,
      url: "src",
    });

    viewer.show();
  };

  const onDelete = (file: FileDetail) => {
    const newFileList = fileList.filter(f => f !== file);
    onChange(newFileList);
  };

  return (
    fileList.length > 0 && (
      <FlexWrapper
        gap={16}
        direction="row"
        style={{
          width: "100%",
          overflowX: "scroll",
          paddingBottom: "14px",
        }}
        ref={viewerRef}
      >
        {fileList.map((file, index) => (
          <ThumbnailPreview
            key={`${index.toString()}`}
            file={file}
            onClick={() => handleClick(index)}
            onDelete={onDelete}
            disabled={disabled}
          />
        ))}
      </FlexWrapper>
    )
  );
};

export default ThumbnailPreviewList;
