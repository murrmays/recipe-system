package com.example.recipe_api.Product.Dtos;

import lombok.Data;
import java.util.List;

import com.example.recipe_api.Core.Enums.Flag;
import com.example.recipe_api.Product.Enums.ProductCategory;
import com.example.recipe_api.Product.Enums.Readiness;

@Data
public class ProductFilterDto {
    private String search;
    private List<ProductCategory> categories;
    private List<Readiness> readiness;
    private List<Flag> flags;
    private String sort;
}
