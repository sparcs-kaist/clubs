import { overlay } from "overlay-kit";
import React, { useMemo, useRef, useState } from "react";
import styled from "styled-components";

import { ApiFil001RequestBody } from "@clubs/interface/api/file/apiFil001";

import Icon from "@sparcs-clubs/web/common/components/Icon";

import useFileUpload from "../services/postFileUpload";
import usePutFileS3 from "../services/putFileS3";
import { FileDetail } from "./File/attachment";
import ThumbnailPreviewList from "./File/ThumbnailPreviewList";
import FlexWrapper from "./FlexWrapper";
import Modal from "./Modal";
import ConfirmModalContent from "./Modal/ConfirmModalContent";
import Typography from "./Typography";

type FileWithId = {
  file: File;
  fileId?: string;
  previewUrl?: string;
};

interface FileUploadProps {
  fileId?: string;
  placeholder?: string;
  initialFiles?: FileDetail[];
  onChange?: (files: FileDetail[]) => void;
  allowedTypes?: string[];
  multiple?: boolean;
  disabled?: boolean;
}

const FileUploadInner = styled.div`
  /* Auto layout */
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;

  width: 100%;

  /* gray200 */
  border: 1px solid ${({ theme }) => theme.colors.GRAY[200]};
  border-radius: 4px;

  /* Inside auto layout
  flex: none;
  order: 1;
  align-self: stretch;
  flex-grow: 0; */
`;

const FileName = styled.div`
  flex: none;
  order: 0;
  flex-grow: 1;
  /* Auto layout */
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px 12px;
  gap: 10px;

  /* white */
  background: ${({ theme }) => theme.colors.WHITE};

  /* Inside auto layout
    flex: none;
    order: 0;
    flex-grow: 1; */
`;

const UploadIcon = styled.div`
  /* Auto layout */
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 8px 0;
  gap: 10px;

  width: 40px;
  border-radius: 0px 4px 4px 0px;

  /* primary */
  background: ${({ theme }) => theme.colors.PRIMARY};

  /* Inside auto layout */
  /* flex: none;
  order: 1;
  align-self: stretch;
  flex-grow: 0; */
`;

const HiddenInput = styled.input`
  display: none;
`;

const FlexExpand = styled.div`
  flex: 1;
`;

const FileUpload: React.FC<FileUploadProps> = ({
  fileId = "file-upload-input",
  placeholder = "파일을 선택해주세요",
  initialFiles = [],
  onChange = () => {},
  allowedTypes = [],
  multiple = false,
  disabled = false,
}) => {
  const { mutate: uploadFileMutation } = useFileUpload();
  const { mutate: putFileS3Mutation } = usePutFileS3();

  const [files, setFiles] = useState<FileDetail[]>(initialFiles);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const updateFiles = (_files: FileDetail[]) => {
    setFiles(_files);
    onChange(_files);
  };
  const addFiles = (_files: FileDetail[]) => {
    // NOTE: (@dora) do not add files that already exist
    const newFiles = _files.filter(file => !files.find(f => f.id === file.id));
    const updatedFiles = multiple ? [...files, ...newFiles] : newFiles;
    updateFiles(updatedFiles);
  };
  const removeFile = (_file: FileDetail) => {
    const updatedFiles = files.filter(file => file.id !== _file.id);
    updateFiles(updatedFiles);
  };

  const onSubmit = (_files: FileWithId[]) => {
    if (_files.length === 0) {
      return;
    }

    const notUploadedFiles = _files.filter(file => !file.fileId);

    const info: ApiFil001RequestBody = {
      metadata: notUploadedFiles.map(file => ({
        type: file.file.type,
        name: file.file.name,
        size: file.file.size,
      })),
    };

    // NOTE: (@dora) rename files that have the same name
    const nameSet = new Set<string>();
    files.forEach(file => nameSet.add(file.name));
    const processedMetadata = info.metadata.map(file => {
      const { name: originalName } = file;
      if (nameSet.has(originalName)) {
        return {
          ...file,
          name: `copy_of_${originalName}`,
        };
      }
      return file;
    });

    uploadFileMutation(
      { body: { metadata: processedMetadata } },
      {
        onSuccess: data => {
          putFileS3Mutation(
            {
              files: notUploadedFiles.map(file => file.file),
              uploadUrls: data.urls.map(url => url.uploadUrl),
            },
            {
              onSuccess: () => {
                const newFiles: FileDetail[] = data.urls.map((url, index) => ({
                  id: url.fileId,
                  name: url.name,
                  url: notUploadedFiles[index].previewUrl ?? "",
                }));
                addFiles(newFiles);
              },
            },
          );
        },
        onError: error => {
          overlay.open(({ isOpen, close }) => (
            <Modal isOpen={isOpen}>
              <ConfirmModalContent
                onConfirm={() => {
                  close();
                }}
              >
                파일 업로드에 실패했습니다.
                <Typography color="GRAY.300" fs={12} lh={16} fw="REGULAR">
                  {error.message}
                </Typography>
              </ConfirmModalContent>
            </Modal>
          ));
        },
      },
    );
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles: FileWithId[] = Array.from(event.target.files ?? []).map(
      file => ({ file, previewUrl: URL.createObjectURL(file) }),
    );
    onSubmit(newFiles);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    document.getElementById(fileId)?.click();
  };

  const text = useMemo(() => {
    if (files.length === 0) {
      return placeholder;
    }

    if (!multiple) {
      return files[0].name;
    }

    return `${files.length}개의 파일을 선택했습니다`;
  }, [files, multiple, placeholder]);

  return (
    <FlexWrapper direction="column" gap={12} style={{ alignSelf: "stretch" }}>
      <FileUploadInner onClick={handleClick}>
        <FileName>
          <Typography
            color={files.length ? "BLACK" : "GRAY.200"}
            fs={16}
            lh={20}
            fw="REGULAR"
          >
            {text}
          </Typography>
        </FileName>
        <UploadIcon>
          <Icon type="file_upload_outlined" size={20} color="white" />
        </UploadIcon>
        <HiddenInput
          ref={fileInputRef}
          type="file"
          accept={allowedTypes.join(",")}
          multiple={multiple}
          id={fileId}
          onChange={handleFileChange}
        />
      </FileUploadInner>
      <FlexWrapper direction="column" gap={8} padding="0 4px">
        {multiple && (
          <ThumbnailPreviewList
            fileList={files}
            onChange={_files => updateFiles(_files)}
            disabled={disabled}
          />
        )}
        {!multiple && files.length > 0 && (
          <FlexWrapper direction="row" gap={8} key={files[0].id}>
            <Icon type="description_outlined" size={16} color="BLACK" />
            <FlexExpand>
              <Typography color="BLACK" fs={14} lh={16} fw="REGULAR">
                {files[0].name}
              </Typography>
            </FlexExpand>

            {!disabled && (
              <Icon
                type="close_outlined"
                size={16}
                color="BLACK"
                onClick={() => removeFile(files[0])}
              />
            )}
          </FlexWrapper>
        )}
      </FlexWrapper>
    </FlexWrapper>
  );
};

export default FileUpload;
