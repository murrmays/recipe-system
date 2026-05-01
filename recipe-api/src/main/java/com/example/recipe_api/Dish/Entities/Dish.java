package com.example.recipe_api.Dish.Entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

import com.example.recipe_api.Core.Enums.Flag;
import com.example.recipe_api.Dish.Enums.DishCategory;

@Entity
@Table(name = "dishes")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Dish {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;
    @ElementCollection
    @CollectionTable(name = "dish_photos", joinColumns = @JoinColumn(name = "dish_id"))
    @Column(name = "photo_url")
    private List<String> photos;

    private double calories;
    private double proteins;
    private double fats;
    private double carbs;
    
    @ElementCollection
    @CollectionTable(name = "dish_ingredients", joinColumns = @JoinColumn(name = "dish_id"))
    private List<DishIngredient> ingredients;

    private double portionSize;
    @Enumerated(EnumType.STRING)
    private DishCategory category;

    @ElementCollection
    @CollectionTable(name = "dish_flags", joinColumns = @JoinColumn(name = "dish_id"))
    @Column(name = "flag")
    private List<Flag> flags;

    private LocalDateTime creationDate;
    private LocalDateTime editDate;
}