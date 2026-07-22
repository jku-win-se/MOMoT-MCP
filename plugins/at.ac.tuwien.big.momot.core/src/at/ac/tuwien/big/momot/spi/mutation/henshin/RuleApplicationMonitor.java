package at.ac.tuwien.big.momot.spi.mutation.henshin;

import java.io.FileNotFoundException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.List;

import org.eclipse.emf.henshin.interpreter.Match;
import org.eclipse.emf.henshin.interpreter.RuleApplication;
import org.eclipse.emf.henshin.interpreter.UnitApplication;
import org.eclipse.emf.henshin.interpreter.impl.BasicApplicationMonitor;
import org.eclipse.emf.henshin.interpreter.impl.MatchImpl;

/**
 * Internal Henshin adapter rule application monitor.
 * @deprecated For internal adapter use only.
 */
@Deprecated
public class RuleApplicationMonitor extends BasicApplicationMonitor {

   private boolean onlySuccessful = false;

   private final List<Match> completeMatches = new ArrayList<>();
   private final List<Match> partialMatches = new ArrayList<>();
   private final List<Match> resultMatches = new ArrayList<>();

   public void addNonNull(final List<Match> list, final Match element, final boolean isResult) {
      if(element != null) {
         list.add(new MatchImpl(element, isResult));
      }
   }

   public <T> void addNonNull(final List<T> list, final T element) {
      if(element != null) {
         list.add(element);
      }
   }

   public List<Match> getCompleteMatches() {
      return completeMatches;
   }

   public List<Match> getPartialMatches() {
      return partialMatches;
   }

   public List<Match> getResultMatches() {
      return resultMatches;
   }

   public boolean isOnlySuccessful() {
      return onlySuccessful;
   }

   @Override
   public void notifyExecute(final UnitApplication application, final boolean success) {
      if(isOnlySuccessful() && !success) {
         return;
      }

      if(!(application instanceof RuleApplication)) {
         return;
      }

      final RuleApplication app = (RuleApplication) application;
      addNonNull(completeMatches, app.getCompleteMatch(), false);
      addNonNull(partialMatches, app.getPartialMatch(), false);
      addNonNull(resultMatches, app.getResultMatch(), true);
   }

   public RuleApplicationMonitor setOnlySuccessful(final boolean onlySuccessful) {
      this.onlySuccessful = onlySuccessful;
      return this;
   }

   public boolean toFile(final String file) {
      PrintWriter p = null;
      try {
         p = new PrintWriter(file);
         p.append(toString()).flush();
         p.close();
         return true;
      } catch(final FileNotFoundException e) {
         e.printStackTrace();
         return false;
      }
   }

   @Override
   public String toString() {
      String result = new String();
      result += "=== Complete Matches ===\n";
      result += getCompleteMatches().toString();
      result += "\n=== Partial Matches ===\n";
      result += getPartialMatches().toString();
      result += "\n=== Result Matches ===\n";
      result += getResultMatches().toString();
      return result;
   }
}
