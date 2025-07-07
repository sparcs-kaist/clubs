import { HttpException, Injectable, NotFoundException } from "@nestjs/common";

import { ApiRnt002RequestBody } from "@clubs/interface/api/rental/endpoint/apiRnt002";
import {
  ApiRnt003RequestQuery,
  ApiRnt003ResponseOK,
} from "@clubs/interface/api/rental/endpoint/apiRnt003";
import {
  ApiRnt006RequestQuery,
  ApiRnt006ResponseOK,
} from "@clubs/interface/api/rental/endpoint/apiRnt006";

import { RentalObjectRepository } from "../repository/rental.rental-object.repository";
import { RentalOrderRepository } from "../repository/rental.rental-order.repository";
import { RentalServiceRepository } from "../repository/rental.rental-service.repository";

@Injectable()
export class RentalService {
  constructor(
    private readonly rentalObjectRepository: RentalObjectRepository,
    private readonly rentalServiceRepository: RentalServiceRepository,
    private readonly rentalOrderRepository: RentalOrderRepository,
  ) {}

  async getRentalsObjectsAvailable(desiredStart: Date, desiredEnd: Date) {
    const availableObjectIds =
      await this.rentalObjectRepository.getAvailableRentals(
        desiredStart,
        desiredEnd,
      );
    return availableObjectIds;
  }

  async postRental(
    studentId: number,
    clubId: number,
    body: ApiRnt002RequestBody,
  ) {
    const { objects, studentPhoneNumber, purpose, desiredStart, desiredEnd } =
      body;

    const result = await this.rentalServiceRepository.createRental(
      studentId,
      clubId,
      objects,
      purpose,
      desiredStart,
      desiredEnd,
      studentPhoneNumber,
    );
    if (!result) {
      throw new HttpException("Failed to post rental", 423);
    }
    return result;
  }

  async getRentals(query: ApiRnt003RequestQuery): Promise<ApiRnt003ResponseOK> {
    const { clubId, pageOffset, itemCount } = query;
    const { paginatedItems, total } =
      await this.rentalServiceRepository.getRentals(
        clubId,
        pageOffset,
        itemCount,
      );

    return {
      items: paginatedItems,
      total,
      offset: pageOffset,
    };
  }

  async getRental(rentalId) {
    const rental = await this.rentalOrderRepository.getRental(rentalId);
    if (rental === undefined) {
      throw new NotFoundException(`There are no matching rental`);
    }
    return rental;
  }

  async getRentalsMy(
    query: ApiRnt006RequestQuery,
  ): Promise<ApiRnt006ResponseOK> {
    // TODO: 원래는 token student Id 에서 가져와야 하는데 일단은 고정 값(1)로 할게요.
    const { pageOffset, itemCount, startDate, endTerm } = query;
    const { paginatedItems, total } =
      await this.rentalServiceRepository.getRentalsMy(
        pageOffset,
        itemCount,
        startDate,
        endTerm,
      );
    return {
      items: paginatedItems,
      total,
      offset: pageOffset,
    };
  }
}
