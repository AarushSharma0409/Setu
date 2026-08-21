import { Controller, Get, Query } from "@nestjs/common";

import { ListCitiesDto } from "./dto/list-cities.dto";
import { LocationsService } from "./locations.service";

@Controller("locations")
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get("states")
  listStates() {
    return this.locationsService.listStates();
  }

  @Get("cities")
  listCities(@Query() query: ListCitiesDto) {
    return this.locationsService.listCities(query.stateId);
  }
}
