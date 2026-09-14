import { Injectable } from "@nestjs/common";

import { BaseTableFieldMapKeys } from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

interface IdentityRecord {
  id: number;
  name: string;
  email: string | null;
  sid?: string | null;
  userId?: number | null;
  number?: number;
}

class MExchangeLoginIdentity extends MEntity implements IdentityRecord {
  name: string;
  email: string | null;
  sid?: string | null;
  userId?: number | null;
  number?: number;

  constructor(data: IdentityRecord) {
    super();
    Object.assign(this, data);
  }
}

type IdentityQuery = { email: string; userId: number; number: number };
type IdentityField = BaseTableFieldMapKeys<IdentityQuery, "id", {}>;

abstract class ExchangeLoginIdentityRepository extends BaseSingleTableRepository<
  MExchangeLoginIdentity,
  IdentityRecord,
  IdentityQuery
> {
  constructor(modelName: string) {
    super(modelName, MExchangeLoginIdentity);
  }

  protected dbToModelMapping(row: IdentityRecord) {
    return new MExchangeLoginIdentity(row);
  }

  protected modelToDBMapping(model: MExchangeLoginIdentity) {
    return model;
  }

  protected createToDBMapping(model: IdentityRecord) {
    return model;
  }

  protected fieldMap(field: IdentityField) {
    return field;
  }
}

@Injectable()
export class ExchangeLoginUserIdentityRepository extends ExchangeLoginIdentityRepository {
  constructor() {
    super("user");
  }
}

@Injectable()
export class ExchangeLoginStudentIdentityRepository extends ExchangeLoginIdentityRepository {
  constructor() {
    super("student");
  }
}

@Injectable()
export class ExchangeLoginProfessorIdentityRepository extends ExchangeLoginIdentityRepository {
  constructor() {
    super("professor");
  }
}

@Injectable()
export class ExchangeLoginEmployeeIdentityRepository extends ExchangeLoginIdentityRepository {
  constructor() {
    super("employee");
  }
}

@Injectable()
export class ExchangeLoginExecutiveIdentityRepository extends ExchangeLoginIdentityRepository {
  constructor() {
    super("executive");
  }
}
