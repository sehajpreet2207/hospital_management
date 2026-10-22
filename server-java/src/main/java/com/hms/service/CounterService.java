package com.hms.service;

import com.hms.model.Counter;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

/**
 * Service for generating sequential, human-readable IDs such as:
 * - Patients: P0001, P0002...
 * - Doctors:  D001, D002...
 * - Staff:    S001, S002...
 * - Bills:    BILL-0001, BILL-0002...
 *
 * Uses MongoDB findAndModify with $inc and upsert:true for thread-safe atomic increments.
 */
@Service
public class CounterService {

    private final MongoTemplate mongoTemplate;

    public CounterService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * Atomically increments the counter for a given key and formats it with a prefix.
     *
     * @param name   The counter name (e.g., "patient", "doctor", "bill", "staff")
     * @param prefix The prefix to prepend (e.g., "P", "D", "BILL-")
     * @param width  The number of digits to pad with zeros (e.g., 4 gives 0001)
     * @return Formatted sequential ID string (e.g., "P0001")
     */
    public String nextCode(String name, String prefix, int width) {
        Query query = Query.query(Criteria.where("_id").is(name));
        Update update = new Update().inc("seq", 1);
        FindAndModifyOptions options = FindAndModifyOptions.options().returnNew(true).upsert(true);

        Counter counter = mongoTemplate.findAndModify(query, update, options, Counter.class);
        int seq = (counter != null) ? counter.getSeq() : 1;

        return String.format("%s%0" + width + "d", prefix, seq);
    }

    public String nextCode(String name, String prefix) {
        return nextCode(name, prefix, 4);
    }
}
