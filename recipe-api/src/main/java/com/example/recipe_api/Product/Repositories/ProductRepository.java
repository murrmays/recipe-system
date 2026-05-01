package com.example.recipe_api.Product.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.example.recipe_api.Product.Entities.Product;

public interface ProductRepository extends JpaRepository<Product, String>, JpaSpecificationExecutor<Product> {}
