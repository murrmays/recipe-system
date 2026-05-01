package com.example.recipe_api.Core.Helpers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

import com.example.recipe_api.Dish.Dtos.DishReadDto;
import com.example.recipe_api.Dish.Dtos.DishRequestDto;
import com.example.recipe_api.Dish.Entities.Dish;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface DishMapper {

    DishReadDto toReadDto(Dish dish);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "creationDate", ignore = true)
    @Mapping(target = "editDate", ignore = true)
    @Mapping(target = "photos", ignore = true)
    Dish toEntity(DishRequestDto dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "creationDate", ignore = true)
    @Mapping(target = "editDate", ignore = true)
    @Mapping(target = "photos", ignore = true)
    void updateEntityFromDto(DishRequestDto dto, @MappingTarget Dish existingDish);
}
