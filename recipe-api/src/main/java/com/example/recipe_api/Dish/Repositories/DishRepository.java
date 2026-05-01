package com.example.recipe_api.Dish.Repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.recipe_api.Dish.Entities.Dish;

public interface DishRepository extends JpaRepository<Dish, String>, JpaSpecificationExecutor<Dish> {
    @Query("SELECT d FROM Dish d JOIN d.ingredients i WHERE i.product.id = :productId")
    List<Dish> findByProductIdInIngredients(@Param("productId") String productId);
}

