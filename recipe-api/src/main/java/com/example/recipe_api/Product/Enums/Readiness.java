package com.example.recipe_api.Product.Enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Readiness {
    READY("Готовый к употреблению"),
    PREPACK("Полуфабрикат"),
    NEEDS_COOKING("Требует приготовления");

    private final String translation;

    Readiness(String translation) {
        this.translation = translation;
    }

    @JsonValue
    public String getTranslation() {
        return translation;
    }
    @JsonCreator
    public static Readiness fromString(String text) {
        for (Readiness flag : Readiness.values()) {
            if (flag.translation.equalsIgnoreCase(text)) {
                return flag;
            }
        }
        throw new IllegalArgumentException("Неизвестный параметр: " + text);
    }

}
