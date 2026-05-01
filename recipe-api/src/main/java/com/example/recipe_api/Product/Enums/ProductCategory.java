package com.example.recipe_api.Product.Enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ProductCategory {
    FROZEN("Замороженный"),
    MEAT("Мясной"),
    VEGETABLES("Овощи"),
    GREENS("Зелень"),
    HERBS("Специи"),
    GRAINS("Крупы"),
    PRESERVED("Консервы"),
    LIQUID("Жидеость"),
    SWEETS("Сладости");

    private final String value;

    ProductCategory(String value) { this.value = value; }

    @JsonValue
    public String getValue() { return value; }

    @JsonCreator
    public static ProductCategory fromValue(String value) {
        for (ProductCategory category : ProductCategory.values()) {
            if (category.value.equalsIgnoreCase(value)) return category;
        }
        throw new IllegalArgumentException("Unknown category: " + value);
    }
}
