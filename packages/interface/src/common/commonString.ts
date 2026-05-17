import z from "zod";

export const zClubName = z.string().max(128);
export const zClubNameKr = z.string().max(30);
export const zClubNameEn = z.string().max(100);
export const zClubCharacteristic = z.string().max(255);
export const zClubRoom = z.string().max(51);
export const zUserName = z.string().max(255);
export const zFileName = z.string().max(256);
