package com.hms.repository;

import com.hms.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data MongoDB repository for User documents.
 *
 * In Spring Data, you simply declare an interface extending MongoRepository<Entity, IdType>.
 * Spring automatically generates the implementation at runtime!
 *
 * Query methods are generated from method names:
 *   - findByEmail(String email) translates to: db.users.findOne({ email: email })
 *   - existsByEmail(String email) translates to: db.users.countDocuments({ email: email }) > 0
 */
@Repository
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
