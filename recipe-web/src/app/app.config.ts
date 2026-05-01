import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { ProductService } from './product/data/product-service/product-service';
import { ProductStateService } from './product/data/product-state-service/product-state-service';

import { ChevronDown, LucideAngularModule, Pencil, Trash, X} from 'lucide-angular';
import { DishService } from './dish/data/dish-service/dish-service';
import { DishStateService } from './dish/data/dish-state-service/dish-state-service';
import { MockDbService } from './core/data/mock-db-service/mock-db-service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    ProductService,
    ProductStateService,
    MockDbService,
    DishService,
    DishStateService,
    importProvidersFrom(
      LucideAngularModule.pick({Pencil, Trash, X, ChevronDown})
    )
  ]
};
