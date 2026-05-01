package com.example.recipe_api.Core.Helpers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

import com.example.recipe_api.Product.Dtos.ProductReadDto;
import com.example.recipe_api.Product.Dtos.ProductRequestDto;
import com.example.recipe_api.Product.Entities.Product;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface ProductMapper {

    ProductReadDto toReadDto(Product product);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "creationDate", ignore = true)
    @Mapping(target = "editDate", ignore = true)
    @Mapping(target = "photos", ignore = true)
    Product toEntity(ProductRequestDto dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "creationDate", ignore = true)
    @Mapping(target = "editDate", ignore = true)
    @Mapping(target = "photos", ignore = true)
    void updateEntityFromDto(ProductRequestDto dto, @MappingTarget Product existingProduct);
}
