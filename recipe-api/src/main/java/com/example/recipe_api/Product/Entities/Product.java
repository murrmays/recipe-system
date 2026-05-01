package com.example.recipe_api.Product.Entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

import com.example.recipe_api.Core.Enums.Flag;
import com.example.recipe_api.Product.Enums.ProductCategory;
import com.example.recipe_api.Product.Enums.Readiness;

@Entity
@Table(name = "products")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;
    
    @ElementCollection
    @CollectionTable(name = "product_photos", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "photo_url")
    private List<String> photos;

    private double calories;
    private double proteins;
    private double fats;
    private double carbs;
    private String ingredients;

    private ProductCategory category;
    private Readiness readiness;

    @ElementCollection
    @CollectionTable(name = "product_flags", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "flag")
    private List<Flag> flags;

    private LocalDateTime creationDate;
    private LocalDateTime editDate;
}