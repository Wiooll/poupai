## REMOVED Requirements

### Requirement: Isolamento de dados por usuário no Firestore
Motivo: o Firestore deixa de ser mecanismo de persistência de dados financeiros do app.

### Requirement: Bloqueio de acesso cruzado
Motivo: regras de segurança do Firestore deixam de se aplicar após remoção do armazenamento no Firestore.

### Requirement: Integridade de associação de propriedade
Motivo: associação de propriedade será mantida no modelo local por `uid`, sem documentos Firestore.
