#ifndef HASH_TABLE_H
#define HASH_TABLE_H

#include <stdlib.h>

//Hash table size constants
#define HT_INITIAL_BASE_SIZE 53
#define HT_PRIME_1 151
#define HT_PRIME_2 163

//Memory management functions
void* xmalloc(size_t size);
void* xcalloc(size_t num, size_t size);

typedef struct {
    char* key;
    char* value;
} ht_item;

typedef struct {
    int base_size;
    int size;
    int count;
    ht_item** items;
} ht_hash_table;

//Constructor and destructor
ht_hash_table* ht_new(void);
void ht_del_hash_table(ht_hash_table* ht);

//Core operations
void ht_insert(ht_hash_table* ht, const char* key, const char* value);
char* ht_search(ht_hash_table* ht, const char* key);
void ht_delete(ht_hash_table* ht, const char* key);

#endif