#include <stdio.h>
#include <string.h>
#include "../src/hash_table.h"

void print_search(ht_hash_table* ht, const char* key) {
    char* val = ht_search(ht, key);
    if (val == NULL) {
        printf("Key '%s': Not found\n", key);
    } else {
        printf("Key '%s': %s\n", key, val);
    }
}

int main() {
    printf("Creating hash table...\n");
    ht_hash_table* ht = ht_new();
    
    //Basic insertion and retrieval
    printf("\nTest 1: Basic insertion and retrieval\n");
    printf("Inserting key-value pairs\n");
    ht_insert(ht, "name", "John Doe");
    ht_insert(ht, "age", "30");
    ht_insert(ht, "city", "New York");
    
    print_search(ht, "name");
    print_search(ht, "age");
    print_search(ht, "city");
    
    //Update existing key
    printf("\nTest 2: Updating existing key\n");
    printf("Updating age to 31\n");
    ht_insert(ht, "age", "31");
    print_search(ht, "age");
    
    //Delete and search
    printf("\nTest 3: Delete and search\n");
    printf("Deleting 'city'\n");
    ht_delete(ht, "city");
    print_search(ht, "city");
    
    //Search non-existent key
    printf("\nTest 4: Search non-existent key\n");
    print_search(ht, "country");
    
    //Multiple insertions to test resizing
    printf("\nTest 5: Multiple insertions to test resizing\n");
    char key[15];
    char value[15];
    for (int i = 0; i < 50; i++) {
        sprintf(key, "key%d", i);
        sprintf(value, "value%d", i);
        ht_insert(ht, key, value);
    }
    printf("Inserted 50 key-value pairs\n");
    
    //Test some of the inserted pairs
    print_search(ht, "key0");
    print_search(ht, "key25");
    print_search(ht, "key49");
    
    //Cleanup
    printf("\nCleaning up\n");
    ht_del_hash_table(ht);
    printf("Hash table deleted successfully!\n");
    
    return 0;
} 