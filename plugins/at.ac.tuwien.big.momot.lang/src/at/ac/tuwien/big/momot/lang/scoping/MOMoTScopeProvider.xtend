package at.ac.tuwien.big.momot.lang.scoping

import org.eclipse.xtext.xbase.scoping.XImportSectionNamespaceScopeProvider
import org.eclipse.xtext.naming.QualifiedName
import com.google.inject.Inject

class MOMoTScopeProvider extends XImportSectionNamespaceScopeProvider implements org.eclipse.xtext.xbase.scoping.batch.IBatchScopeProvider {
   public static final QualifiedName MOEA_FRAMEWORK = QualifiedName.create("org", "moeaframework");
   public static final QualifiedName MOEA = QualifiedName.create("at","ac", "tuwien", "big", "moea");
   public static final QualifiedName MOMOT = QualifiedName.create("at","ac", "tuwien", "big", "momot");
   
   @Inject org.eclipse.xtext.xbase.scoping.batch.XbaseBatchScopeProvider delegateScopeProvider

   override newSession(org.eclipse.emf.ecore.resource.Resource resource) {
      delegateScopeProvider.newSession(resource)
   }

   override isBatchScopeable(org.eclipse.emf.ecore.EReference reference) {
      delegateScopeProvider.isBatchScopeable(reference)
   }

    override isConstructorCallScope(org.eclipse.emf.ecore.EReference reference) {
       delegateScopeProvider.isConstructorCallScope(reference)
    }

    override isFeatureCallScope(org.eclipse.emf.ecore.EReference reference) {
       delegateScopeProvider.isFeatureCallScope(reference)
    }
   
   override protected getImplicitImports(boolean ignoreCase) {
      val imports = super.getImplicitImports(ignoreCase)
      imports.add(doCreateImportNormalizer(MOEA_FRAMEWORK, true, false))
      imports.add(doCreateImportNormalizer(MOEA, true, false))
      imports.add(doCreateImportNormalizer(MOMOT, true, false))
      return imports
   }
}
