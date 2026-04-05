import 'package:flutter/material.dart';

/// Sticky bottom navigation bar for step navigation (mobile-first).
class BottomNavBar extends StatelessWidget {
  final VoidCallback? onBack;
  final VoidCallback? onNext;
  final String nextLabel;
  final bool nextEnabled;
  final bool isLoading;

  const BottomNavBar({
    super.key,
    this.onBack,
    this.onNext,
    this.nextLabel = 'Next',
    this.nextEnabled = true,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border(top: BorderSide(color: theme.colorScheme.outlineVariant)),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            if (onBack != null)
              Expanded(
                child: OutlinedButton(
                  onPressed: onBack,
                  child: const Text('Back'),
                ),
              ),
            if (onBack != null) const SizedBox(width: 12),
            Expanded(
              child: FilledButton(
                onPressed: nextEnabled && !isLoading ? onNext : null,
                child: isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text(nextLabel),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
