import { Injectable } from "@nestjs/common";

import { PrismaService } from "../database/prisma.service";

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listStates() {
    const states = await this.prisma.state.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    return { states };
  }

  async listCities(stateId?: string) {
    const cities = await this.prisma.city.findMany({
      where: {
        isActive: true,
        stateId,
        state: { isActive: true },
      },
      orderBy: [{ state: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        stateId: true,
        name: true,
        slug: true,
        state: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      cities: cities.map((city) => ({
        id: city.id,
        stateId: city.stateId,
        stateName: city.state.name,
        name: city.name,
        slug: city.slug,
      })),
    };
  }
}
