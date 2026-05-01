package com.example.recipe_api.Product.Dtos;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

import com.example.recipe_api.Core.Enums.Flag;
import com.example.recipe_api.Product.Enums.ProductCategory;
import com.example.recipe_api.Product.Enums.Readiness;

@Data
@Builder
public class ProductReadDto {
    private String id;
    private String name;
    private List<String> photos;
    private double calories;
    private double proteins;
    private double fats;
    private double carbs;
    private String ingredients;
    private ProductCategory category;
    private Readiness readiness;
    private List<Flag> flags;
    private LocalDateTime creationDate;
    private LocalDateTime editDate;
}
