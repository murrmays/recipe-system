package com.example.recipe_api.Dish.Entities;

import com.example.recipe_api.Product.Entities.Product;

import jakarta.persistence.Embeddable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data @NoArgsConstructor @AllArgsConstructor
public class DishIngredient {
    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;
    private double amount;
}
