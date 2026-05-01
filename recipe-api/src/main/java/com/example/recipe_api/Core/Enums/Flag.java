package com.example.recipe_api.Core.Enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Flag {
    VEGAN("Веган"),
    GLUTEN_FREE("Без глютена"),
    NO_SUGAR("Без сахара");

    private final String translation;

    Flag(String translation) {
        this.translation = translation;
    }

    @JsonValue
    public String getTranslation() {
        return translation;
    }

    @JsonCreator
    public static Flag fromString(String text) {
        for (Flag flag : Flag.values()) {
            if (flag.translation.equalsIgnoreCase(text)) {
                return flag;
            }
        }
        throw new IllegalArgumentException("Неизвестный флаг: " + text);
    }
}
