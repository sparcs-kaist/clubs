import { IProfessor } from "@clubs/domain/user/professor";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

export interface IProfessorCreate {
  name: IProfessor["name"];
  userId: IProfessor["userId"];
  email: IProfessor["email"];
  phoneNumber: IProfessor["phoneNumber"];
  professorEnum: IProfessor["professorEnum"];
  department: IProfessor["department"];
}

export class MProfessor extends MEntity implements IProfessor {
  name: IProfessor["name"];
  userId: IProfessor["userId"];
  email: IProfessor["email"];
  professorEnum: IProfessor["professorEnum"];
  phoneNumber: IProfessor["phoneNumber"];
  department: IProfessor["department"];

  constructor(data: IProfessor) {
    super();
    Object.assign(this, data);
  }
}

export interface RMProfessor {
  id: MProfessor["id"];
  name: MProfessor["name"];
  email: MProfessor["email"];
  professorEnum: MProfessor["professorEnum"];
  phoneNumber: MProfessor["phoneNumber"];
  department: MProfessor["department"];
}
