package com.example.recipe_api.Dish.Enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum DishCategory {
    DESSERT("Десерт", "!десерт"),
    FIRST_COURSE("Первое", "!первое"),
    SECOND_COURSE("Второе", "!второе"),
    DRINK("Напиток", "!напиток"),
    SALAD("Салат", "!салат"),
    SOUP("Суп", "!суп"),
    SNACK("Перекус", "!перекус");

    private final String translation;
    private final String macro;

    DishCategory(String translation, String macro) {
        this.translation = translation;
        this.macro = macro;
    }

    @JsonValue
    public String getTranslation() { return translation; }
    public String getMacro() { return macro; }

    @JsonCreator
    public static DishCategory fromString(String text) {
        for (DishCategory cat : DishCategory.values()) {
            if (cat.translation.equalsIgnoreCase(text)) return cat;
        }
        return null;
    }
}