import { SetMetadata } from "@nestjs/common";

import { studentUserTypes } from "@clubs/interface/common/enum/user.enum";

export const IS_PUBLIC_KEY = "publicMethod";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
export const Student = () => Roles(...studentUserTypes);
export const Executive = () => Roles("executive");
export const Professor = () => Roles("professor");
export const Employeee = () => Roles("employee");
